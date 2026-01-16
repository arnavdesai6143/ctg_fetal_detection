import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import './AboutPage.css';

const AboutPage = () => {
    return (
        <Layout>
            <div className="page about-page">
                {/* Hero Section */}
                <div className="about-hero">
                    <div className="hero-content">
                        <div className="hero-logo">🏥</div>
                        <h1 className="hero-title">CTG Insight™</h1>
                        <p className="hero-tagline">AI for Continuous Fetal Monitoring</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="about-grid">
                    <Card title="Purpose & Vision" className="about-card">
                        <p>
                            CTG Insight is a clinical decision support system designed to assist
                            healthcare professionals in interpreting cardiotocography (CTG) recordings
                            during labor. Our AI models analyze patterns in fetal heart rate and
                            uterine contractions to identify early signs of fetal distress.
                        </p>
                        <p>
                            We believe that AI should augment, not replace, clinical judgment.
                            Our system provides real-time insights while keeping clinicians in
                            full control of patient care decisions.
                        </p>
                    </Card>

                    <Card title="Validation Study Summary" className="about-card">
                        <div className="validation-stats">
                            <div className="stat">
                                <span className="stat-value">2,126</span>
                                <span className="stat-label">CTG recordings analyzed</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">89%</span>
                                <span className="stat-label">Balanced accuracy</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">0.94</span>
                                <span className="stat-label">AUC-ROC score</span>
                            </div>
                        </div>
                        <p className="validation-note">
                            Validated on the UCI Machine Learning Repository CTG dataset with
                            consensus labels from three expert obstetricians.
                        </p>
                        <Button variant="link">View Full Study →</Button>
                    </Card>

                    <Card title="Supported Hospitals" className="about-card">
                        <div className="hospitals-list">
                            <div className="hospital-item">
                                <span className="hospital-name">Singapore General Hospital</span>
                                <span className="hospital-status active">Active</span>
                            </div>
                            <div className="hospital-item">
                                <span className="hospital-name">KK Women's and Children's Hospital</span>
                                <span className="hospital-status active">Active</span>
                            </div>
                            <div className="hospital-item">
                                <span className="hospital-name">National University Hospital</span>
                                <span className="hospital-status pilot">Pilot</span>
                            </div>
                        </div>
                    </Card>

                    <Card title="Data Privacy Policy" className="about-card">
                        <div className="compliance-badges">
                            <span className="compliance-badge">HIPAA Compliant</span>
                            <span className="compliance-badge">GDPR Compliant</span>
                            <span className="compliance-badge">SOC 2 Type II</span>
                        </div>
                        <ul className="privacy-list">
                            <li>All patient data is encrypted at rest and in transit</li>
                            <li>No personally identifiable information (PII) is used in model training</li>
                            <li>Data retention follows hospital policies and regulatory requirements</li>
                            <li>Regular security audits and penetration testing</li>
                        </ul>
                    </Card>
                </div>

                {/* Contact Section */}
                <Card className="contact-card">
                    <div className="contact-content">
                        <div className="contact-info">
                            <h3>Get in Touch</h3>
                            <p>For inquiries about deploying CTG Insight at your institution:</p>
                            <div className="contact-details">
                                <div className="contact-item">
                                    <span className="contact-label">Email</span>
                                    <a href="mailto:info@ctginsight.ai">info@ctginsight.ai</a>
                                </div>
                                <div className="contact-item">
                                    <span className="contact-label">Sales</span>
                                    <a href="mailto:sales@ctginsight.ai">sales@ctginsight.ai</a>
                                </div>
                                <div className="contact-item">
                                    <span className="contact-label">Support</span>
                                    <a href="mailto:support@ctginsight.ai">support@ctginsight.ai</a>
                                </div>
                            </div>
                        </div>
                        <div className="contact-cta">
                            <Button variant="primary" size="lg">Request Demo</Button>
                            <Button variant="secondary" size="lg">View Documentation</Button>
                        </div>
                    </div>
                </Card>

                {/* Footer */}
                <div className="about-footer">
                    <p>© 2025 CTG Insight. All rights reserved.</p>
                    <p>Version 2.1 | For clinical decision support only</p>
                </div>
            </div>
        </Layout>
    );
};

export default AboutPage;
